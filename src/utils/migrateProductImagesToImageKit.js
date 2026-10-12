import path from "node:path"
import mongoose from "mongoose"
import config from "../config/config.js"
import productModel from "../models/products.model.js"
import { getImageKitUrlOrigin, uploadFile } from "../services/storage.service.js"

const MAX_IMAGE_SIZE = 25 * 1024 * 1024

async function downloadImage(imageUrl) {
    const sourceUrl = new URL(imageUrl)
    if (sourceUrl.protocol !== "https:" || sourceUrl.username || sourceUrl.password) {
        throw new Error("Only public HTTPS image URLs can be migrated")
    }

    const response = await fetch(sourceUrl, {
        redirect: "error",
        signal: AbortSignal.timeout(30_000)
    })

    if (!response.ok) {
        throw new Error(`Image download failed with HTTP ${response.status}`)
    }

    if (!response.headers.get("content-type")?.startsWith("image/")) {
        throw new Error("Image URL did not return an image")
    }

    const contentLength = Number(response.headers.get("content-length"))
    if (contentLength > MAX_IMAGE_SIZE) {
        throw new Error(`Image exceeds the ${MAX_IMAGE_SIZE / 1024 / 1024} MB migration limit`)
    }

    const chunks = []
    let size = 0
    for await (const chunk of response.body) {
        size += chunk.length
        if (size > MAX_IMAGE_SIZE) {
            throw new Error(`Image exceeds the ${MAX_IMAGE_SIZE / 1024 / 1024} MB migration limit`)
        }
        chunks.push(chunk)
    }

    return Buffer.concat(chunks)
}

function imageKitFileName(productId, index, imageUrl) {
    const originalName = path.posix.basename(new URL(imageUrl).pathname)
        .replace(/[^a-zA-Z0-9._-]/g, "_")
    const safeName = originalName || "image"
    return `product-${productId}-${index + 1}-${safeName}`
}

async function migrateImages() {
    if (!config.MONGO_URI) {
        throw new Error("MONGO_URI must be set")
    }
    if (!config.IMAGEKIT_PUBLIC_KEY || !config.IMAGEKIT_PRIVATE_KEY || !config.IMAGEKIT_URL_ENDPOINT) {
        throw new Error("IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT must be set")
    }

    const imageKitOrigin = getImageKitUrlOrigin()
    await mongoose.connect(config.MONGO_URI)

    const products = await productModel.find({ images: { $exists: true, $ne: [] } })
        .select("_id images")
        .lean()

    let migrated = 0
    let skipped = 0
    let failed = 0

    for (const product of products) {
        for (const [index, imageUrl] of product.images.entries()) {
            if (typeof imageUrl !== "string") {
                console.error(`Product ${product._id}, image ${index + 1}: image URL is not a string`)
                failed++
                continue
            }

            try {
                if (new URL(imageUrl).origin === imageKitOrigin) {
                    skipped++
                    continue
                }

                const result = await uploadFile({
                    buffer: await downloadImage(imageUrl),
                    fileName: imageKitFileName(product._id, index, imageUrl),
                    useUniqueFileName: false,
                    overwriteFile: true
                })

                const update = await productModel.updateOne(
                    { _id: product._id, [`images.${index}`]: imageUrl },
                    { $set: { [`images.${index}`]: result.url } }
                )

                if (update.matchedCount !== 1) {
                    throw new Error("Product image changed during migration; database was not updated")
                }

                migrated++
                console.log(`Migrated product ${product._id}, image ${index + 1}`)
            } catch (error) {
                console.error(`Product ${product._id}, image ${index + 1}: ${error.message}`)
                failed++
            }
        }
    }

    console.log(`Image migration finished: ${migrated} migrated, ${skipped} already on ImageKit, ${failed} failed`)
    if (failed > 0) {
        process.exitCode = 1
    }
}

try {
    await migrateImages()
} catch (error) {
    console.error(`Image migration failed: ${error.message}`)
    process.exitCode = 1
} finally {
    await mongoose.disconnect()
}

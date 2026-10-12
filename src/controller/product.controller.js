import mongoose from "mongoose"
import productModel from "../models/products.model.js"
import { uploadFile } from "../services/storage.service.js"

export async function createProduct(req, res) {
    const filesUrls = []

    for (const file of req.files ?? []) {
        const response = await uploadFile({
            buffer: file.buffer,
            fileName: file.originalname
        })

        filesUrls.push(response.url)
    }

    const product = await productModel.create({
        title: req.body.title,
        description: req.body.description,
        price: {
            amount: req.body.price.amount,
            currency: req.body.price.currency
        },
        sizes: req.body.sizes,
        images: filesUrls,
        seller: req.user.userId
    })


    res.status(201).json({
        message: "Product created successfully",
        data: {
            product
        }
    })
}

export async function listAllProducts(req, res) {
    const products = await productModel.find({ published: true }).sort({ _id: -1 }).lean()

    res.status(200).json({
        message: "Products data fetched successfully",
        data: {
            products
        }
    })

}

export async function getProduct(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: "Product not found" })
    }

    const product = await productModel.findOne({ _id: req.params.id, published: true }).lean()

    if (!product) {
        return res.status(404).json({ message: "Product not found" })
    }

    return res.status(200).json({
        message: "Product data fetched successfully",
        data: { product }
    })
}

export async function listAllProductsToSeller(req,res){
    const products = await productModel.findById(id)

    if(!products){
        return res.status(404).json({
            message:"Product not found by id"
        })
    }

    await productModel.findByIdAndUpdate(id,{published:false})

    return res.status(200).json({
        message:"Product unpublished successfully"
    })
}

export async  function listProducts(req,res){
    const {id} =req.params

    const product = await productModel.findById(id)

    if(!product){
        return res.status(404).json({
            message:"Product ot found by id"
        })
    }

    await productModel.findByIdAndUpdate(id,{published:true})

    return res.status(200).json({
        message:"Product published successfully"
    })
}
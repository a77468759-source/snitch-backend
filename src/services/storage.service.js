import ImageKit from "imagekit";
import config from "../config/config.js"

let client;

export function getImageKitUrlOrigin() {
    if (!config.IMAGEKIT_URL_ENDPOINT) {
        throw new Error("IMAGEKIT_URL_ENDPOINT must be set")
    }

    return new URL(config.IMAGEKIT_URL_ENDPOINT).origin
}

function getClient() {
    const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = config

    if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
        throw new Error("IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT must be set")
    }

    client ??= new ImageKit({
        publicKey: IMAGEKIT_PUBLIC_KEY,
        privateKey: IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: IMAGEKIT_URL_ENDPOINT
    })

    return client
}

export async function uploadFile({ buffer, fileName, useUniqueFileName, overwriteFile }) {
    const response = await getClient().upload({
        file: buffer,
        fileName: fileName,
        folder: "snitch",
        useUniqueFileName,
        overwriteFile
    })

    return response;
}
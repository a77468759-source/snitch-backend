import mongoose from "mongoose";
import productModel from "../models/products.model.js";


const DEMO_SIZES = ["S", "M", "L", "XL"];

const seedData = async () => {
    try {
   
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/snitch");
        console.log("Database Connected Successfully!");

       
        const SELLER_ID = "65f1234567890abcdef12345"; 

  
        const res = await fetch("https://www.snitch.co.in/products.json?limit=100");
        const data = await res.json();


        const formattedProducts = data.products.map(item => {
     
            let cleanDesc = item.body_html ? item.body_html.replace(/<[^>]*>?/gm, "").trim() : "";
            
            
            if (cleanDesc.length < 20) {
                cleanDesc = `${item.title} - High quality product from Snitch collection. Stylish and comfortable wear.`;
            }
           
            cleanDesc = cleanDesc.substring(0, 490);

  
            const productImages = item.images.map(img => img.src).slice(0, 5);

   
            const productSizes = DEMO_SIZES.map(size => ({
                size,
                stock: 50
            }))

            return {
                title: item.title.substring(0, 95), // Max 100 length check
                description: cleanDesc,
                images: productImages,
                price: {
                    amount: parseFloat(item.variants[0]?.price || 999),
                    currency: "INR"
                },
                sizes: productSizes,
                seller: new mongoose.Types.ObjectId(SELLER_ID),
                published: true
            };
        });

       
        await productModel.deleteMany({});
        await productModel.insertMany(formattedProducts);

        console.log(`Successfully seeded ${formattedProducts.length} Snitch products!`);
        process.exit(0);

    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedData();
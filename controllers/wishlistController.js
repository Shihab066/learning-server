import { getWishlistCollection } from "../collections.js";

export const addWishListItem = async (req, res) => {
    try {
        const wishlistCollection = await getWishlistCollection();
        const wishlistItem = req.body;
        const result = await wishlistCollection.insertOne(wishlistItem);
        res.status(201).json(result);
        
    } catch (error) {
        console.log('Error adding wishListItem:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });        
    }
}
import { ObjectId } from "mongodb";
import { getBannerCollection } from "../collections.js";

export const getAllBanner = async (req, res) => {
    try {
        const bannerCollection = await getBannerCollection();

        const result = await bannerCollection.find().toArray();
        res.json(result);
    } catch (error) {
        console.log('Error fetching banner images:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const addBanner = async (req, res) => {
    try {
        const bannerCollection = await getBannerCollection();
        const bannerInfo = req.body;

        const result = await bannerCollection.insertOne(bannerInfo);
        res.status(201).json(result);
    } catch (error) {
        console.log('Error adding banner image:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const bannerCollection = await getBannerCollection();
        const { bannerId } = req.params;
        const upatedInfo = req.body;

        const updateDoc = {
            $set: upatedInfo
        }
        const result = await bannerCollection.updateOne({ _id: new ObjectId(bannerId) }, updateDoc);
        res.json(result);
    } catch (error) {
        console.log('Error updating banner image:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const bannerCollection = await getBannerCollection();
        const { bannerId } = req.params;

        const result = await bannerCollection.deleteOne({ _id: new ObjectId(bannerId) });
        res.json(result);
    } catch (error) {
        console.log('Error updating banner image:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
import { getPaymentsCollection } from "../collections.js";

export const getTotalSalesInfo = async (req, res) => {
    try {
        const paymentsCollection = await getPaymentsCollection();
        const result = await paymentsCollection.aggregate([
            {
                $facet: {
                    totalSales: [
                        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
                        { $project: { totalAmount: { $toString: "$totalAmount" } } }
                    ],
                    thisYearSales: [
                        {
                            $match: {
                                purchaseDate: {
                                    $gte: new Date(new Date().getFullYear(), 0, 1),
                                    $lt: new Date(new Date().getFullYear() + 1, 0, 1)
                                }
                            }
                        },
                        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
                        // { $project: { totalAmount: { $toString: "$totalAmount" } } }
                    ],
                    thisMonthSales: [
                        {
                            $match: {
                                purchaseDate: {
                                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                                    $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                                }
                            }
                        },
                        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
                        { $project: { totalAmount: { $toString: "$totalAmount" } } }
                    ]
                }
            },
            {
                $project: {
                    totalSalesAmount: { $arrayElemAt: ["$totalSales.totalAmount", 0] },
                    thisYearSalesAmount: { $arrayElemAt: ["$thisYearSales.totalAmount", 0] },
                    thisMonthSalesAmount: { $arrayElemAt: ["$thisMonthSales.totalAmount", 0] }
                }
            }
        ]).toArray()

        res.json(result);

    } catch (error) {
        console.error("Error fetching totalSalesInfo:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
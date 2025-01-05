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
                        $gte: new Date(`${new Date().getFullYear()}-01-01T00:00:00.000Z`),
                        $lt: new Date(`${new Date().getFullYear() + 1}-01-01T00:00:00.000Z`)
                      }
                    }
                  },
                  { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
                  { $project: { totalAmount: { $toString: "$totalAmount" } } }
                ],
                thisMonthSales: [
                  {
                    $match: {
                      purchaseDate: {
                        $gte: new Date(
                          `${new Date().getFullYear()}-${String(
                            new Date().getMonth() + 1
                          ).padStart(2, "0")}-01T00:00:00.000Z`
                        ),
                        $lt: new Date(
                          `${new Date().getFullYear()}-${String(
                            new Date().getMonth() + 2
                          ).padStart(2, "0")}-01T00:00:00.000Z`
                        )
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
                totalSalesAmount: { $ifNull: [{ $arrayElemAt: ["$totalSales.totalAmount", 0] }, "0"] },
                thisYearSalesAmount: { $ifNull: [{ $arrayElemAt: ["$thisYearSales.totalAmount", 0] }, "0"] },
                thisMonthSalesAmount: { $ifNull: [{ $arrayElemAt: ["$thisMonthSales.totalAmount", 0] }, "0"] }
              }
            }
          ]).toArray()
          

        res.json(result[0]);

    } catch (error) {
        console.error("Error fetching totalSalesInfo:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
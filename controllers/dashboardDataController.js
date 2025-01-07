import { getEnrollmentCollection, getPaymentsCollection } from "../collections.js";

export const getTotalSalesData = async (req, res) => {
    try {
        const paymentsCollection = await getPaymentsCollection();
        const enrollmentCollection = await getEnrollmentCollection();

        // Pipeline for total sales info
        const totalSalesPipeline = [
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
        ];

        // Pipeline for total sales chart info
        const totalSalesChartPipeline = [            
            {
                $group: {
                    _id: {
                        year: { $year: "$enrollmentDate" },
                        month: { $month: "$enrollmentDate" }
                    },
                    totalUnits: { $sum: 1 } // Count each document as a unit sale
                }
            },
            {
                $group: {
                    _id: "$_id.year",
                    yearlySales: { $sum: "$totalUnits" },
                    monthlySales: {
                        $push: {
                            month: "$_id.month",
                            totalUnits: "$totalUnits"
                        }
                    }
                }
            },
            {
                $addFields: {
                    monthlySales: {
                        $map: {
                            input: { $range: [1, 13] }, // Generate months from 1 to 12
                            as: "month",
                            in: {
                                $let: {
                                    vars: {
                                        sale: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$monthlySales",
                                                        as: "m",
                                                        cond: { $eq: ["$$m.month", "$$month"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: { $ifNull: ["$$sale.totalUnits", "0"] }
                                }
                            }
                        }
                    }
                }
            },           
            {
                $project: {
                    _id: 0,
                    year: { $toString: "$_id" },
                    yearlySales: { $toString: "$yearlySales" },
                    monthlySales: { $map: { input: "$monthlySales", as: "s", in: { $toString: "$$s" } } },                   
                }
            },
            {
                $sort: { year: 1 }
            }
        ];

        // Pipeline for total sales amount chart info
        const totalSalesAmountChartPipeline = [           
            {
                $group: {
                    _id: {
                        year: { $year: "$purchaseDate" },
                        month: { $month: "$purchaseDate" }
                    },
                    totalAmount: { $sum: "$amount" } // Sum the 'amount' for each month
                }
            },
            {
                $group: {
                    _id: "$_id.year",
                    yearlySalesAmount: { $sum: "$totalAmount" },
                    monthlySales: {
                        $push: {
                            month: "$_id.month",
                            totalAmount: "$totalAmount"
                        }
                    }
                }
            },
            {
                $addFields: {
                    monthlySalesAmount: {
                        $map: {
                            input: { $range: [1, 13] },
                            as: "month",
                            in: {
                                $let: {
                                    vars: {
                                        sale: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$monthlySales",
                                                        as: "m",
                                                        cond: { $eq: ["$$m.month", "$$month"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: { $toString: { $ifNull: ["$$sale.totalAmount", 0] } }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    year: { $toString: "$_id" },
                    yearlySalesAmount: { $toString: "$yearlySalesAmount" },
                    monthlySalesAmount: 1,                    
                }
            },
            {
                $sort: { year: 1 }
            }
        ];

        const totalSalesData = await paymentsCollection.aggregate(totalSalesPipeline).toArray();
        const totalSalesChartData = await enrollmentCollection.aggregate(totalSalesChartPipeline).toArray();
        const totalSalesCount= await enrollmentCollection.countDocuments();
        const totalSalesAmountChartData = await paymentsCollection.aggregate(totalSalesAmountChartPipeline).toArray();

        res.json({
            totalSales: totalSalesData[0],
            totalSalesCount: totalSalesCount,
            totalSalesChartData: totalSalesChartData,
            totalSalesAmountChartData: totalSalesAmountChartData
        });

    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

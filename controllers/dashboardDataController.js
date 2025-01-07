import { getEnrollmentCollection, getPaymentsCollection } from "../collections.js";

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

export const getTotalSalesChartInfo = async (req, res) => {
    try {
        const enrollmentCollection = await getEnrollmentCollection();

        const pipeLine = [
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
                    monthlySales: { $map: { input: "$monthlySales", as: "s", in: { $toString: "$$s" } } }
                }
            },
            {
                $sort: { year: 1 }
            }
        ];

        const result = await enrollmentCollection.aggregate(pipeLine).toArray();

        res.json(result);

    } catch (error) {
        console.error("Error fetching totalSalesChartInfo:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const getTotalSalesAmountChartInfo = async (req, res) => {
    try {
        const paymentsCollection = await getPaymentsCollection();

        const pipeLine = [
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
                    yearlySalesAmount: { $sum: "$totalAmount" }, // Sum the total amount for the year
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
                    monthlySalesAmount: 1
                }
            },
            {
                $sort: { year: 1 } // Sort by year in ascending order
            }
        ];

        const result = await paymentsCollection.aggregate(pipeLine).toArray();

        res.json(result);

    } catch (error) {
        console.error("Error fetching totalSalesAmountChartInfo:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


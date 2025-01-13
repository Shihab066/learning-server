import { getEnrollmentCollection, getPaymentsCollection, getReviewsCollection } from "../collections.js";
import { authorizeInstructor } from "./authorizationController.js";

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
                $match: { status: "succeeded" }
            },
            {
                $addFields: {
                    salesCount: { $size: "$courses" } // Calculate the sales count as the length of the 'course' array
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$purchaseDate" },
                        month: { $month: "$purchaseDate" }
                    },
                    totalSales: { $sum: "$salesCount" } // Sum the sales count for each month
                }
            },
            {
                $group: {
                    _id: "$_id.year",
                    yearlySales: { $sum: "$totalSales" },
                    monthlySales: {
                        $push: {
                            month: "$_id.month",
                            totalSales: "$totalSales"
                        }
                    }
                }
            },
            {
                $addFields: {
                    monthlySales: {
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
                                    in: { $toString: { $ifNull: ["$$sale.totalSales", 0] } }
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
                    monthlySales: 1
                }
            },
            {
                $sort: { year: 1 }
            }
        ];

        // Pipeline for total sales amount chart info
        const totalSalesAmountChartPipeline = [
            {
                $match: { status: "succeeded" }
            },
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
        const totalSalesChartData = await paymentsCollection.aggregate(totalSalesChartPipeline).toArray();
        const totalSalesCount = await enrollmentCollection.countDocuments();
        const totalSalesAmountChartData = await paymentsCollection.aggregate(totalSalesAmountChartPipeline).toArray();

        res.json({
            totalSales: totalSalesData[0],
            totalSalesCount: totalSalesCount.toString(),
            totalSalesChartData: totalSalesChartData,
            totalSalesAmountChartData: totalSalesAmountChartData
        });

    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInstructorTotalSalesData = async (req, res) => {
    try {
        const enrollmentCollection = await getEnrollmentCollection();

        const { instructorId } = req.params;

        // Pipeline for total sales info
        const totalSalesPipeline = [
            {
                $match: { _instructorId: instructorId }
            },
            {
                $facet: {
                    totalSales: [
                        { $group: { _id: null, totalAmount: { $sum: "$price" } } },
                        { $project: { totalAmount: { $toString: "$totalAmount" } } }
                    ],
                    thisYearSales: [
                        {
                            $match: {
                                enrollmentDate: {
                                    $gte: new Date(`${new Date().getFullYear()}-01-01T00:00:00.000Z`),
                                    $lt: new Date(`${new Date().getFullYear() + 1}-01-01T00:00:00.000Z`)
                                }
                            }
                        },
                        { $group: { _id: null, totalAmount: { $sum: "$price" } } },
                        { $project: { totalAmount: { $toString: "$totalAmount" } } }
                    ],
                    thisMonthSales: [
                        {
                            $match: {
                                enrollmentDate: {
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
                        { $group: { _id: null, totalAmount: { $sum: "$price" } } },
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
                $match: { _instructorId: instructorId }
            },
            {
                $addFields: {
                    salesCount: 1 // Calculate the sales count as the length of the 'course' array
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$enrollmentDate" },
                        month: { $month: "$enrollmentDate" }
                    },
                    totalSales: { $sum: "$salesCount" } // Sum the sales count for each month
                }
            },
            {
                $group: {
                    _id: "$_id.year",
                    yearlySales: { $sum: "$totalSales" },
                    monthlySales: {
                        $push: {
                            month: "$_id.month",
                            totalSales: "$totalSales"
                        }
                    }
                }
            },
            {
                $addFields: {
                    monthlySales: {
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
                                    in: { $toString: { $ifNull: ["$$sale.totalSales", 0] } }
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
                    monthlySales: 1
                }
            },
            {
                $sort: { year: 1 }
            }
        ];

        // Pipeline for total sales amount chart info
        const totalSalesAmountChartPipeline = [
            {
                $match: { _instructorId: instructorId }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$enrollmentDate" },
                        month: { $month: "$enrollmentDate" }
                    },
                    totalAmount: { $sum: "$price" } // Sum the 'amount' for each month
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

        const authorizeStatus = await authorizeInstructor(instructorId, req.decoded.email);

        if (authorizeStatus === 200) {
            const totalSalesData = await enrollmentCollection.aggregate(totalSalesPipeline).toArray();
            const totalSalesChartData = await enrollmentCollection.aggregate(totalSalesChartPipeline).toArray();
            const totalSalesCount = await enrollmentCollection.countDocuments({ _instructorId: instructorId });
            const totalSalesAmountChartData = await enrollmentCollection.aggregate(totalSalesAmountChartPipeline).toArray();

            res.json({
                totalSales: totalSalesData[0],
                totalSalesCount: totalSalesCount.toString(),
                totalSalesChartData: totalSalesChartData,
                totalSalesAmountChartData: totalSalesAmountChartData
            });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInstructorReviewsStatistics = async (req, res) => {
    try {
        const reviewsCollection = await getReviewsCollection();

        const { instructorId } = req.params;

        const pipeline = [
            {
                $match: { _instructorId: instructorId }
            },
            {
                $facet: {
                    counts: [
                        {
                            $group: {
                                _id: "$rating",
                                total: { $sum: 1 }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    ratings: {
                        $map: {
                            input: [1, 2, 3, 4, 5],
                            as: "star",
                            in: {
                                $let: {
                                    vars: {
                                        match: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$counts",
                                                        as: "c",
                                                        cond: { $eq: ["$$c._id", "$$star"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: { $ifNull: ["$$match.total", 0] }
                                }
                            }
                        }
                    }
                }
            }
        ];

        // const authorizeStatus = await authorizeInstructor(instructorId, req.decoded.email);
        const authorizeStatus = 200;

        if (authorizeStatus === 200) {
            const totalReviewsData = await reviewsCollection.aggregate(pipeline).toArray();
            const totalReviewsCount = await reviewsCollection.countDocuments({ _instructorId: instructorId });

            res.json({ reviewsStatistics: totalReviewsData[0].ratings, totalReviews: totalReviewsCount });
        }
        else if (authorizeStatus === 403) res.status(403).json({ error: true, message: 'Forbidden Access' });

    } catch (error) {
        console.error("Error fetching reviews data:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


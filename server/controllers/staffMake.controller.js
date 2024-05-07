import financialModelingPrep from 'financialmodelingprep';
import dbpool from '../db/connectAWSdb.js';
import jwt from "jsonwebtoken";

export const staffinsertStock = async (req, res) => {
    try {
        //const { StockSymbol, cookies } = req.body
        const StockSymbol = 'INTC';

        //const payload = jwt.verify(cookies, 'Bhun-er')
        //const StaffID = payload['StaffID']
        const StaffID = 1;


        const apiKey = "gQERlMvVTI5GZJtzaVkQgSLTBpXiuxW7";
        const fmp = financialModelingPrep(apiKey);
        const stockjson = await fmp.stock(StockSymbol).profile();
        const pool = dbpool;

        // res.json(res);
        pool.getConnection((err, connection) => {
            if (err) throw err
            const query_stock = `INSERT INTO Stocks (StockSymbol, CompanyName, Exchange, CurrentPrice, MarketCap, LastestDividend, Sector, Industry, Website, ImageURL)
                VALUES (?, ?, ?, 0, ?, 0, ?, ?, ?, ?)`
            const values_stock = [StockSymbol, stockjson['profile']['companyName'], stockjson['profile']['exchange'], stockjson['profile']['mktCap'], stockjson['profile']['sector'], stockjson['profile']['industry'], stockjson['profile']['website'], stockjson['profile']['image']]
            connection.query(query_stock, values_stock, (err, results) => {
                if (err) throw err
                console.log(results)
                //connection.release()
                //res.status(200).send('Stock insert successfully') 
            })

            const query_BrokerID = `SELECT BrokerID From Broker_Staffs WHERE StaffID = ?`
            connection.query(query_BrokerID, [StaffID], (err, results) => {
                if (err) throw err
                const Broker = results[0]
                //console.log(Broker)
                const query_StockID = `SELECT StockID FROM Stocks ORDER BY stockID DESC LIMIT 1;`
                connection.query(query_StockID, (err, results) => {
                    if (err) throw err
                    const Stock = results[0]
                    //console.log(Stock)
                    const query_Stock_Available = `INSERT INTO Stock_Available (BrokerID,StockID) VALUES (?, ?)`
                    connection.query(query_Stock_Available, [Broker['BrokerID'], Stock['StockID']], (err, results) => {
                        if (err) throw err
                        res.status(200).send('INSERT SUCCESS');
                    })
                })
            })

        })
    } catch (error) {
        res.status(500).send('Error inserting stock');
    }
}


import dbpool from '../db/connectAWSdb.js';
import jwt from "jsonwebtoken";
// stockView controller
export const stockView = (req, res) => {
    const { StockSymbol, cookies } = req.body;
    // console.log("This is cookie" + req.cookies);
    // console.log("This is fake cookie" + cookies);
    const payload = jwt.verify(cookies, 'Bhun-er')
    // let userID
    // jwt.verify(cookies, "Bhun-er", (err, decoded) => {
    //     if(err) {
    //         console.log(err)
    //     } else {
    //          userID = decoded['UserID']
    //     }
    //    })
    const  userID = payload['userID']
    console.log(cookies)
    console.log(payload['userID'])
    dbpool.getConnection(async (err, connection) => {
        if (err) throw err;
        try {
            let stock;
            const query = `SELECT * FROM Stocks WHERE StockSymbol = ?`;
            connection.query(query, [StockSymbol], async(err, rows) => {
                if (err) throw err;
                
                stock = rows[0];
                console.log(stock);
                
                if (!stock) {
                    connection.release();
                    return res.status(400).json({ error: "Cannot get data" });
                }
                
                connection.query(`SELECT * FROM Stock_Prices_History WHERE StockID = ?`, [stock['StockID']], (err, rows) => {
                    if (err) {
                        connection.release();
                        throw err;
                    }
                    
                    const stock_hist = rows;
                    if (!stock_hist) {
                        connection.release();
                        return res.status(400).json({ error: "Cannot get data" });
                    }
                    const query = `SELECT SUM(Volume), TransactionType FROM Transaction WHERE UserID = ? AND StockID = ? GROUP BY TransactionType`
                    connection.query(query, [userID, stock['StockID']], (err, rows) => {
                        if (err) {
                            connection.release();
                            throw err;
                        }

                        if (!rows) {
                            connection.release();
                            return res.status(400).json({ error: "Cannot get data" });
                        }
                        console.log(userID);
                        const netVol = rows[0]['SUM(Volume)'] - rows[1]['SUM(Volume)']
                        
                        const query = `SELECT AccountBalance FROM Users WHERE UserID = ?`
                        connection.query(query, [userID], (err, rows) => {
                        if (err) {
                            connection.release();
                            throw err;
                        }

                        if (!rows) {
                            connection.release();
                            return res.status(400).json({ error: "Cannot get data" });
                        }
                        console.log(userID);
                        const userBalance = rows[0]
                        const stockViewData = Object.assign(stock, {stock_hist}, {netVol}, userBalance)
                        console.log(stockViewData)
                        
                        connection.release();
                        res.status(200).send(stockViewData);
                        })
                        // //last inner before edit
                        // const stockViewData = Object.assign(stock, {stock_hist}, {netVol})
                        // //console.log(stockViewData)
                        // res.status(200).send(stockViewData);
                    })
                    
                });
            });
            //connection.release();
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
};

export const makePayment = (req, res) => {
    const {cookies,Amounts, Type, AccountBalance } = req.body
    const payload = jwt.verify(cookies, 'Bhun-er')
    const  userID = payload['userID']
    
    dbpool.getConnection(async(err, connection) => {
        if (err) throw err
        try {
            const insertQuery = `INSERT INTO Payments (UserID, Amounts, Type, PaymentDateTime)`
            connection.query(insertQuery, [userID, Amounts, Type, 'currentTime'], (err, results) => {
                if (err) throw err
                console.log(results)
            })
            const editBalanceQuery = `UPDATE Users SET AccountBalance = ? WHERE UserID = ?`
            connection.query(editBalanceQuery, [AccountBalance-Amounts, userID], (err, results) => {
                if (err) throw err
                console.log(results)
                connection.release()
                res.status(200).send('Complete payment : ' + Type + 'success') 
            })
        } catch (error) {
            connection.release()
            console.log(error)
        }
    })
}

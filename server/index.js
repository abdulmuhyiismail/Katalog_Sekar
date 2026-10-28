const express = require ("express");
const app = express();
const cors = require("cors");
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/",(req,res) => {
    res.send("Hello Dari Server!");
});

app.get("/api/katalog", (req, res) => {
    const produk = [
        {
            id : 1, nama : "Bunga", harga : 5000 
        }
    ];

    res.json(produk);
});
app.listen(port, () => {
    console.log(`server berjalan di http://localhost:${port}`)
} )
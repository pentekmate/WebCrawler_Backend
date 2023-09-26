const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const rateLimit = require("express-rate-limit");
const app = express();
const cors = require("cors");
app.use(cors());

let results=[];

const limiter = rateLimit({
  windowMs: 1000*60*15, // 15 perc
  max: 15, // Maximum 10 kérés 15 perc alatt
  message: "Túl sok kérés érkezett ebből az IP-címből, kérlek próbáld újra később."
});

const url="https://hardverapro.hu/aprok/hardver/monitor/lcd/21-26/index.html"
const url2="https://www.vatera.hu/szamitastechnika/monitorok/index-c104.html?q=monitor"
const port = 3001;

app.use('/hardverapro',limiter, async function (req, res) {
  try{
    results=[]
    await hardverapro(); // Megvárjuk a hardverapro függvény befejeződését
    await vatera(); //
    results.sort((a,b)=>a.megnevezes-b.megnevezes)
    res.send(results)
  }
  catch(e)
  {
    console.log(e)
  }
   
});
async function hardverapro()
{
  try {
    const resopnse = await axios.get(url).then((response) => {
     
     // Load the HTML into cheerio
     const $ = cheerio.load(response.data);
     
     // Create an empty array to store the products
     const products = [];
     // Loop through each product on the page
     $(".media").each((i, el) => {
       const product = $(el);
       const id=i
       //remove white spaces from price
       const priceWhole = product.find(".uad-price").text().slice(0,-2).replace(/\s/g, '');
       //
       //store Crawler information
       const name = product.find(".uad-title").children("h1").children("a").text()
       const link = product.find(".uad-image").attr("href")
       const time = product.find(".uad-ultralight").children("time").text().slice(2)
       const image = product.find(".uad-image").children("img").attr("src").slice(0,-4)
       

       // If both title, price and link are not empty, add to products array
       if (priceWhole !==0 && name !==""&& time !=="őresorolt hirdetés") {
         let timeFormed;
         const [hours, minutes] =time.split(':');
         const timeObj = new Date();         
         timeObj.setHours(hours);
         timeObj.setMinutes(minutes);
         
         if(timeObj.getMinutes()<10)
         {
           console.log(timeObj.getMinutes())

           timeFormed=timeObj.getHours()+":0"+timeObj.getMinutes()
         }
         else{
           timeFormed=timeObj.getHours()+":"+timeObj.getMinutes()
         }
        results.push({webhely:"hardverapro",id:id,ar:priceWhole,megnevezes:name,ut:link,ido:timeFormed,kep:image})
       }
     });
   });
 } catch (error) {
   res.send("Hibas url")
 }
}
async function vatera()
{
  try {
    // Get the HTML from the URL
    const response= await axios.get(url2).then((response) => {
      
      // Load the HTML into cheerio
      const $ = cheerio.load(response.data);
      
      // Create an empty array to store the products
      const products = [];
      // Loop through each product on the page
      $("div.prod-inner-container").each((i, el) => {
        const product = $(el);
        let  id=results.length+1
        //remove white spaces from price
        const name = product.find("a").attr("title")
        const link = product.find("a").attr("href")
        const image = product.find(".pic-holder").children(".picbox").children("img").attr("data-original")
        let price = product.find(".ar").find(".originalVal").text().replace(/\s/g, '')
        const time="none"
        if(price.length>10)
        {
          price=price.slice(0,price.length/4)
        }
        price= price=price.slice(0,price.length/2)
        if(price!==""&& name!=="")
        { 

         results.push({webhely:"vatera",id:id,ar:price,megnevezes:name,ut:link,ido:time,kep:image})    
        }
        results.sort()
      });   
    });
  } catch (error) {
   console.log(e)
  }
}
  app.listen(port, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", port);
  });
  
 


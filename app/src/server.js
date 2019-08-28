var ecommerce_store_artifacts = require('../../build/contracts/EcommerceStore.json')
var contract = require('truffle-contract')
var Web3 = require('web3')
var provider = new Web3.providers.HttpProvider("http://localhost:8545");
var EcommerceStore = contract(ecommerce_store_artifacts);
EcommerceStore.setProvider(provider);

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var ProductModel = require('./product');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var express = require('express');

var app = express();

app.use(function(req, res, next) {
 res.header("Access-Control-Allow-Origin", "*");
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 next();
});

app.listen(3001, function() {
 console.log("Ebay on Ethereum server listening on port 3001");
});

app.get('/', function(req, res) {
 res.send("Hello, Ethereum!");
});

app.get('/products', function(req, res) {
 var query = {};
 if (req.query.category !== undefined) {
  query['category'] = {$eq: req.query.category};
 }

 ProductModel.find(query, null, {sort: 'startTime'}, function(err, items) {
  console.log(items.length);
  res.send(items);
 });
});

setupProductEventListner();

function setupProductEventListner() {
 var productEvent;
 var buyEvent;
 EcommerceStore.deployed().then(function(i) {
  productEvent = i.NewProduct({fromBlock: 0, toBlock: 'latest'})
  productEvent.watch(function(err, result) {
   if (err) {
    console.log(err)
    return;
   }
   console.log(result.args);
   saveProduct(result.args);
  });

  buyEvent = i.BuyProduct({fromBlock: 0, toBlock: 'latest'});
  buyEvent.watch(function(err, result) {
   if (err) {
    console.log(err)
    return;
   }
   console.log(result.args);
   updateProduct(result.args);
  });
 });
}

function saveProduct(product) {
 ProductModel.findOne({ 'blockchainId': product._productId.toNumber() }, function (err, dbProduct) {
  if (dbProduct != null) {
   return;
  }

  var p = new ProductModel({name: product._name, blockchainId: product._productId,
   category: product._category, ipfsImageHash: product._imageLink, ipfsDescHash: product._descLink,
   startTime: product._startTime, price: product._price, condition: product._productCondition
   });

  p.save(function(error) {
   if (error) {
    console.log(error);
   } else {
    ProductModel.count({}, function(err, count) {
     console.log("count is " + count);
    });
   }
  });
 })
}

function updateProduct(product) {
 ProductModel.findOne({ 'blockchainId': product._productId.toNumber() }, function (err, dbProduct) {
  if (dbProduct == null) {
   return;
  }
  dbProduct.buyer = product._buyer;
  dbProduct.save(function (err) {
   if (err) {
    handleError(err);
   }
  });
 })
}
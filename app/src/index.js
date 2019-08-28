import Web3 from "web3";
import "./app.css";
import ecommerceStoreArtifact from "../../build/contracts/EcommerceStore.json";

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI({host:'localhost',port:'5001',})

var reader;

const App = {
 web3: null,
 account: null,
 instance: null,

 start: async function() {
  const { web3 } = this;

  try {
   // get contract instance
   const networkId = await web3.eth.net.getId();
   const deployedNetwork = ecommerceStoreArtifact.networks[networkId];
   this.instance = new web3.eth.Contract(
    ecommerceStoreArtifact.abi,
    deployedNetwork.address,
   );

   // get accounts
   const accounts = await web3.eth.getAccounts();
   this.account = accounts[0];

   if($("#product-details").length>0){
    let productId = new URLSearchParams(window.location.search).get('id');
    this.renderProductDetails(productId);
   }
   else{
    this.renderStore();
   }

  } catch (error) {
   console.error("Could not connect to contract or chain.");
  }

  $("#product-image").change(function(event) {
    const file = event.target.files[0];
    reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
  });

  $("#add-item-to-store").submit(function(event) {
    const req = $("#add-item-to-store").serialize();
    let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
    let decodedParams = {}
    Object.keys(params).forEach(function(v) {
     decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
    });
    console.log(decodedParams);
    App.saveProduct(decodedParams);
    event.preventDefault();
  });

  $("#buy-now").submit(function(event) {
    $("#msg").hide();
    var sendAmount = $("#buy-now-price").val();
    var productId = $("#product-id").val();
    App.instance.methods.buy(productId).send({value: sendAmount, from: App.account}).then(function(f){
    $("#msg").show();
    $("#msg").html("You have successfully purchased the product!");
    })
    event.preventDefault();
  });

 },

  saveProduct: async function(product) {
  // 1. Upload image to IPFS and get the hash
  // 2. Add description to IPFS and get the hash
  // 3. Pass the 2 hashes to addProductToStore

  const { addProductToStore } = this.instance.methods;
  var imageId = await this.saveImageOnIpfs(reader)
  var descId = await this.saveTextBlobOnIpfs(product["product-description"])
  addProductToStore(product["product-name"], product["product-category"], imageId,
      descId, Date.parse(product["product-start-time"]) / 1000,
     this.web3.utils.toWei(product["product-price"], 'ether'), product["product-condition"]).send({from: this.account, gas: 4700000});
 },

 saveImageOnIpfs: async function(reader) {
  return new Promise(function(resolve, reject) {
   const buffer = Buffer.from(reader.result);
   ipfs.add(buffer)
   .then((response) => {
    console.log(response)
    resolve(response[0].hash);
   }).catch((err) => {
    console.error(err)
    reject(err);
   })
  })
 },

 saveTextBlobOnIpfs: async function(blob) {
  return new Promise(function(resolve, reject) {
   const descBuffer = Buffer.from(blob, 'utf-8');
   ipfs.add(descBuffer)
   .then((response) => {
    console.log(response)
    resolve(response[0].hash);
   }).catch((err) => {
    console.error(err)
    reject(err);
   })
  })
 },

 renderStore: async function() {
  const { productIndex } = this.instance.methods;
  var count = await productIndex().call();
  for(var i=1; i<= count; i++) {
   this.renderProduct(i);
  }
 },

 renderProduct: async function(index) {
  const { getProduct } = this.instance.methods;
  var f = await getProduct(index).call()
  let node = $("<div/>");
  node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
  node.append("<img src='http://localhost:8080/ipfs/" + f[3] + "' />");
  node.append("<div class='title'>" + f[1] + "</div>");
  node.append("<div> Price: " + displayPrice(f[6]) + "</div>");
  node.append("<a href='product.html?id=" + f[0] + "'>Details</div>");
  if (f[8] === '0x0000000000000000000000000000000000000000') {
   $("#product-list").append(node);
  } else {
   $("#product-purchased").append(node);
  }
 },

 renderProductDetails: async function(productId) {
  const { getProduct } = this.instance.methods;
  var p = await getProduct(productId).call();
  $("#product-name").html(p[1]);
  $("#product-image").html("<img width='200' src='http://localhost:8080/ipfs/" + p[3] + "' />");
  $("#product-price").html(displayPrice(p[6]));
  $("#buy-now-price").val(p[6]);
  $("#product-id").val(p[0]);
  ipfs.cat(p[4]).then(function(file){
    var content = file.toString();
    $("#product-desc").append("<div>"+content+"</div>");
  })
 },

};

function displayPrice(amt) {
 return "Ξ" + App.web3.utils.fromWei(amt, 'ether');
}

window.App = App;

window.addEventListener("load", function() {
 if (window.ethereum) {
  // use MetaMask's provider
  App.web3 = new Web3(window.ethereum);
  window.ethereum.enable(); // get permission to access accounts
 } else {
  console.warn(
   "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
  );
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  App.web3 = new Web3(
   new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
  );
 }

 App.start();
});
import Web3 from "web3";
import pposongArtifact from "../../build/contracts/PPosong.json";

const App = {
    web3: null,
    account: null,
    pposong: null,
    contractAddress: null,

  start: async function() {
      const {web3} = this;
      try {
          // get contract instance
          const networkId = await web3.eth.net.getId();
          const deployedNetwork = pposongArtifact.networks[networkId];
          this.contractAddress = deployedNetwork.address;
          this.pposong = new web3.eth.Contract(
              pposongArtifact.abi,
              deployedNetwork.address,
              );

          // get accounts
          const accounts = await web3.eth.getAccounts();
          this.account = accounts[0];
          
          this.showAllReview();

      } catch (error) {
          console.log(error);
          console.error("Could not connect to contract or chain.");
      }

  },

showAllReview: async function(){

    const { getAllReview } = this.pposong.methods;
    $("#reviewTable").empty();

    let reviewList =await getAllReview().call();

    for(var i=0;i<reviewList.length;i++)
    {
        var review = reviewList[i];
        $("#reviewTable").append("<tr><td>" + this.web3.utils.hexToUtf8(review) + "</td></tr>");
    }

},

addReview : async function(){
    let newReview = $("#newReview").val();
    $("#newReview").val("");

    const {addReview} = this.pposong.methods;
    await addReview(this.web3.utils.asciiToHex(newReview)).send({gas:140000,from: this.account});
    this.showAllReview();
}

};

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
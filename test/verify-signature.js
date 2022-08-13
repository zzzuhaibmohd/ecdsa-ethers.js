const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerifySignature", function () {
  it("Check Signature", async function () {
    const accounts = await ethers.getSigners();
    // init "VerifySignature"
    const VerifySignature = await ethers.getContractFactory("VerifySignature");
    const contract = await VerifySignature.deploy();
    await contract.deployed();

    /*
    load the privateKey from a .env file
    const privateKey = "0x..."
    const signer = new ethers.Wallet(privateKey)
    */
    const signer = accounts[0];
    const to = accounts[1].address;
    const amount = 444;
    const message = "Hello World";
    const nonce = 420; //signer.getTransactionCount()
    
    const hash = await contract.getMessageHash(to, amount, message, nonce);
    //signMessage is inbuilt in ethers to sign Messages with private key 
    //string to bytes
    const signature = await signer.signMessage(ethers.utils.arrayify(hash)); 

    const ethHash = await contract.getEthSignedMessageHash(hash);
    console.log("Signed Tx Hash: " + ethHash);
    console.log("Signed Tx Length: " + (ethHash.length - 1)); // -1 -> ignore 0x
    console.log("Recover Signer: " + await contract.recoverSigner(ethHash, signature));

    expect(await contract.recoverSigner(ethHash, signature)).to.equal(signer.address);
    expect(await contract.verify(signer.address, to, amount, message, nonce, signature)).to.equal(true);
    expect(await contract.verify(signer.address, to, amount + 1, message, nonce, signature)).to.equal(false);
  });
});

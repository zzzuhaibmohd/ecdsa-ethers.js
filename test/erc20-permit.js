const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const { ethers } = require("hardhat");

  //helper-function from uniswap and modified
  async function getPermitSignature(signer, token, spender, value, deadline) {
    const [nonce, name, version, chainId] = await Promise.all([
      token.nonces(signer.address),
      token.name(),
      "1",
      signer.getChainId(),
    ])
  
    return ethers.utils.splitSignature(
      await signer._signTypedData(
        {
          name,
          version,
          chainId,
          verifyingContract: token.address,
        },
        {
          Permit: [
            {
              name: "owner",
              type: "address",
            },
            {
              name: "spender",
              type: "address",
            },
            {
              name: "value",
              type: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
            },
            {
              name: "deadline",
              type: "uint256",
            },
          ],
        },
        {
          owner: signer.address,
          spender,
          value,
          nonce,
          deadline,
        }
      )
    )
  }

  describe("ERC20Permit", function () {
    it("Check ERC20 Permit", async function () {
      const accounts = await ethers.getSigners(1);
      const signer = accounts[0];
     
      //deploy ERC20 Token
      const Token = await ethers.getContractFactory("Token")
      const token = await Token.deploy()
      await token.deployed()
    
      ////deploy Vault Contract
      const Vault = await ethers.getContractFactory("Vault")
      const vault = await Vault.deploy(token.address)
      await vault.deployed()
      
      //mint tokens
      await token.mint(signer.address, 1000);
    
      const amount = 1000;
      const deadline = ethers.constants.MaxUint256;
    
      const {v, r, s} = await getPermitSignature( //getPermitSignature(signer, token, spender, value, deadline)
        signer,
        token,
        vault.address,
        amount,
        deadline
      );
    
      console.log("\nBALANCES BEFORE");
      console.log("Token Balance of VAULT: " + await token.balanceOf(vault.address));
      console.log("Token Balance of SIGNER: " + await token.balanceOf(signer.address));

      await vault.depositWithPermit(amount, deadline, v, r, s);

      console.log("\nBALANCES AFTER");
      console.log("Token Balance of VAULT: " + await token.balanceOf(vault.address));
      console.log("Token Balance of SIGNER: " + await token.balanceOf(signer.address));
      expect(await token.balanceOf(vault.address)).to.be.equal(amount);
    });
  });
  
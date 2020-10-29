const chai = require("chai")

chai.use(require("chai-as-promised"))

const expect = chai.expect

const MultiSig = artifacts.require("MultiSig.sol")

contract("MultiSig", accounts => {
    const owners = [accounts[0], accounts[1], accounts[2]]
    const confirms = 2
    //three owners and need 2 conformations
    //for each test, contract instance 

    let wallet 
    beforeEach(async () => {
        wallet = await MultiSig.new(owners, confirms)
    })

    describe("constructor", () => {
        it("should deploy", async () => {
          const wallet = await MultiSig.new(
            owners,
            confirms
          )
    
          for (let i = 0; i < owners.length; i++) {
            assert.equal(await wallet.owners(i), owners[i])
          }
    
          assert.equal(
            await wallet.minimumConformations(),
            confirms
          )
        })
    
        it("should reject if no owners", async () => {
          await expect(MultiSig.new([], confirms)).to.be
            .rejected
        })
    
        it("should reject if num conf required > owners", async () => {
          await expect(MultiSig.new(owners, owners.length + 1)).to.be.rejected
        })
    })

    describe("fallback", async () => {
      it("should receive ether", async () => {
        const { logs } = await wallet.sendTransaction({
          from: accounts[0],
          value: 1,
        })
  
        assert.equal(logs[0].event, "Deposit")
        assert.equal(logs[0].args.sender, accounts[0])
        assert.equal(logs[0].args.amount, 1)
        assert.equal(logs[0].args.balance, 1)
      })
    })

    describe("execute", () => {

        beforeEach(async () => {
            const to = owners[0]
            const value = 0
            const data = "0x0"
    
            await wallet.transact(to, value, data) //creates transactiion and this should be confirmed by atleast two owners
            await wallet.confirm(0, { from: owners[0] } )
            await wallet.confirm(0, { from: owners[1] } )
        })
    
        //execute transaction should succeed
        // ""          ""       ""   fail
        it("should execute", async () => {
            
            const response = await wallet.execute(0, {from: accounts[0]})
            
            // check  isexecuted is set to true
            // emitted Execute
            const { logs } = response
            assert.equal(logs[0].event, "Execute")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.index, 0)
    
            const tx = await wallet.getTransaction(0)
            assert.equal(tx.executed, true) 
        })
        
        //execute transaction should fail
        it("should fail/reject if already executed", async () => {
            await wallet.execute(0, {from: accounts[0]}) //executing first - when executed again it shpuld fail
            
            try {
               await wallet.execute(0, {from: accounts[0]})
               throw new Error("execution not failed the second time")
            } catch (error) {
                assert.equal(error.reason, "transaction already Executed")
            }
            
            //try catch works fine
            //now using chai
            //await expect( await wallet.execute(0, {from: accounts[0]})).to.be.rejected

            await expect(
              wallet.execute(0, {
                from: owners[0],
              })
            ).to.be.rejected
          })
      
        it("should reject if not owner", async () => {
            await expect(
              wallet.execute(0, {
                from: accounts[3],
              })
            ).to.be.rejected
        })

        it("should reject if index does not exist", async () => {
          await expect(
            wallet.execute(1, {
              from: owners[0],
            })
          ).to.be.rejected

    }) //end of describe "execute" block
  })

    describe("Revoke Confirmation", async () => {
    beforeEach(async () => {
      const to = accounts[3]
      const value = 0
      const data = "0x0"

      await wallet.transact(to, value, data)
      await wallet.confirm(0, { from: owners[0] })
    })

    it("should revoke confirmation", async () => {
      const { logs } = await wallet.revokeConformation(0, {
        from: owners[0],
      })

      assert.equal(logs[0].event, "RevokeConformation")
      assert.equal(logs[0].args.owner, owners[0])
      assert.equal(logs[0].args.index, 0)

      assert.equal(await wallet.isConfirmed(0, owners[0]), false)

      const index = await wallet.getTransaction(0)
      assert.equal(index.numberOfConfims, 0)
    })

    it("should reject if not owner", async () => {
      await expect(
        wallet.revokeConformation(0, {
          from: accounts[3],
        })
      ).to.be.rejected
    })

    it("should reject if index does not exist", async () => {
      await expect(
        wallet.revokeConformation(1, {
          from: owners[0],
        })
      ).to.be.rejected
    })
  })

    describe("getOwners", () => {
    it("should return owners", async () => {
      const result = await wallet.getOwners()

      for (let i = 0; i < result.length; i++) {
        assert.equal(result[i], owners[i])
      }
    })
  })

    describe("getTransactionCount", () => {
    it("should return index/number of traansaction count", async () => {
      assert.equal(await wallet.getTransactionCount(), 0)
    })
  })

    describe("confirm Transaction", () => {
    beforeEach(async () => {
      const to = accounts[3]
      const value = 0
      const data = "0x0011"

      await wallet.transact(to, value, data)
    })

    it("should confirm", async () => {
      const { logs } = await wallet.confirm(0, {
        from: owners[0],
      })

      assert.equal(logs[0].event, "Confirm")
      assert.equal(logs[0].args.owner, owners[0])
      assert.equal(logs[0].args.index, 0)

      const index = await wallet.getTransaction(0)
      assert.equal(index.numberOfConfims, 1)
    })

    it("should reject if not an owner", async () => {
      await expect(
        wallet.confirm(0, {
          from: accounts[3],
        })
      ).to.be.rejected
    })

    it("should reject if index does not exist", async () => {
      await expect(
        wallet.confirm(1, {
          from: owners[0],
        })
      ).to.be.rejected
    })

    it("should reject if already confirmed", async () => {
      await wallet.confirm(0, {
        from: owners[0],
      })

      await expect(
        wallet.confirm(0, {
          from: owners[0],
        })
      ).to.be.rejected
    })
  })

    describe("Transact", () => {
    const to = accounts[3]
    const value = 0
    const data = "0x0011"

    it("should transact", async () => {
      const { logs } = await wallet.transact(to, value, data, {
        from: owners[0],
      })

      assert.equal(logs[0].event, "Transact")
      assert.equal(logs[0].args.owner, owners[0])
      assert.equal(logs[0].args.index, 0)
      assert.equal(logs[0].args.to, to)
      assert.equal(logs[0].args.value, value)
      assert.equal(logs[0].args.data, data)

      assert.equal(await wallet.getTransactionCount(), 1)

      const tx = await wallet.getTransaction(0)
      assert.equal(tx.to, to)
      assert.equal(tx.value, value)
      assert.equal(tx.data, data)
      assert.equal(tx.numberOfConfims, 0)
      assert.equal(tx.executed, false)
    })

    it("should reject if not owner", async () => {
      await expect(
        wallet.transact(to, value, data, {
          from: accounts[3],
        })
      ).to.be.rejected
    })
  })

}) // end - contract block


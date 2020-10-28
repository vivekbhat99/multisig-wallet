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

}) // end - contract block


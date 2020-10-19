const chai = require("chai")

chai.use(require("chai-as-promised"))

const MultiSig = artifacts.require("MultiSig.sol")

contract("MultiSig", accounts => {
    const owners = [accounts[0], accounts[1], accounts[2]]
    const conforms = 2
    //three owners and need 2 conformations
    //for each test, contract instance 
    let wallet 
    beforeEach(async () => {
        wallet = await MultiSig.new(owners, conforms)
    })

    //execute transaction should succeed
    // ""          ""       ""   fail

    it("should execute", async () => {
        const to = owners[0]
        const value = 0
        const data = "0x0"

        await wallet.transact(to, value, data) //creates transactiion and this should be confirmed by atleast two owners
        await wallet.confirm(0, { from: owners[0] } )
        await wallet.confirm(0, { from: owners[1] } )

        const response = await wallet.execute(0, {from: accounts[0]})

        //
        
    })

})


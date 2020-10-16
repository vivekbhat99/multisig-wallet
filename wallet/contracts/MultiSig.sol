pragma solidity ^0.5.16;

contract MultiSig{
    
    address[] public owners;
    uint8 public minimumConformations;
    mapping (address => bool) public isUniqueOwner;
    
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool isExecuted;
        mapping (address => bool) isConfirmed;
        uint8 numberOfConfims;
    }
    
    Transaction[] public transactions;
    
    constructor(address[] memory _owners, uint8 _minimumConformations) public {
        require(_owners.length > 0, "can't have zero owners, minimum one owner required");
        require(_minimumConformations > 0 && _minimumConformations <= _owners.length, "can't have zero confirmation, minimum one, max equal to number of owners");
        
        minimumConformations = _minimumConformations;
        
        for (uint8 i=0; i<_owners.length; i++){
           address owner = _owners[i];
           require(owner != address(0), "owner can't have address 0");
           //require(!isUniqueOwner[owner], "should be unique owner, this owner already exists!");
           isUniqueOwner[owner] = true; 
           owners.push(owner);
        }
    }
    
    
    // fallback function 
    function() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
    
    modifier onlyOwner {
        require(isUniqueOwner[msg.sender], "only owner can call this function");
        _;
    }
    
    modifier indexExists(uint index) {
        require(index < transactions.length,"invalid index number");
        _;
    }
    
    modifier notExecuted(uint index) {
        require(!transactions[index].isExecuted, "transaction already Executed");
        _;
    }
    
    modifier notConfirmed(uint index){
        require(!transactions[index].isConfirmed[msg.sender], "this transaction is already confirmed");
        _;
    }
    

    event Deposit(address indexed sender, uint amount, uint balance);
    event Transact(address indexed owner, uint indexed index, address indexed to, uint value, bytes data);
    event Confirm(address indexed owner, uint indexed index);
    event Execute(address indexed owner, uint indexed index);
    event RevokeConformation(address indexed owner, uint indexed index);
    
    function transact(address _to, uint _value, bytes memory _data) public onlyOwner {
        // creating Transaction ID as lengthh of transcation i.e Ist transcation will have id =0, next =1 and so on; 
        // transactions is array of struct Transaction;
        
        uint index = transactions.length; 
        
        transactions.push(Transaction({
            to : _to,
            value : _value,
            data : _data,
            isExecuted: false,
            numberOfConfims : 0
        }));
        emit Transact(msg.sender, index, _to, _value,_data);
    }
    
    function confirm(uint _index) public onlyOwner indexExists(_index) notExecuted(_index) notConfirmed(_index){
        Transaction storage transaction = transactions[_index];
        transaction.isConfirmed[msg.sender] = true;
        
        // this means that msg.sender has approved for the transaction 
        // so increase the number of conformations of the transaction
        
        transaction.numberOfConfims += 1;
        
        emit Confirm(msg.sender, _index);
    }
 
    function execute(uint _index) public onlyOwner indexExists(_index) notExecuted(_index) {
        Transaction storage transaction = transactions[_index];
        require(transaction.numberOfConfims >= minimumConformations, "minimum number of conformations not satisfied so cannot execute");
        transaction.isExecuted = true;
        
        // execute the transaction with call method 
        
        (bool isSuccess, ) = transaction.to.call.value(transaction.value)(transaction.data);
        require(isSuccess, "not executed, FAILED");
        emit Execute(msg.sender, _index);
    }

    function revokeConformation(uint _index) public onlyOwner indexExists(_index) notExecuted(_index) {
        Transaction storage transaction = transactions[_index];
        require(transaction.isConfirmed[msg.sender] == true, "this transaction already not confirmed");
        transaction.isConfirmed[msg.sender] = false;
        emit RevokeConformation(msg.sender, _index);
    }
    
    function deposit() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

}   







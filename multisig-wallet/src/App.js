import logo from './logo.svg';
import './App.css';
import React from "react";
import { Message, Button } from "semantic-ui-react";

function App() {
  const account = "0x665599"
  return (
    <div className="App">
      <header className="App-header">
        <h1>Multi-Signature Wallet</h1>
        <div>Account: {account}</div>

        <Message warning>Metamask is not connected :/</Message>
        <Button color = "green">Connect to Metamask</Button>


      </header>
    </div>
  );
}

export default App;

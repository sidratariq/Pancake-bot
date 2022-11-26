const ethers = require('ethers');

const addresses = {
  WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  factory: '0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc',
  router: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
  recipient: '0x518E3a4fe18A6aD1708e6a5efAD533C235FcC783'
}

const provider = new ethers.providers.WebSocketProvider('wss://ws-nd-186-441-216.p2pify.com/5ce376816d1963db2884ce68878344fc');
const wallet = new ethers.Wallet('0xb15773022ebe1a1f40db803e6aa9afa4da8a1c76a0a0eb2344b21c2f98269e6f',provider); //signing purpose

const account = wallet.connect(provider);

const factory = new ethers.Contract(
  addresses.factory,
  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
  account
);

const router = new ethers.Contract( 
  addresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

// const wbnb = new ethers.Contract(
//   addresses.WBNB,
//   [
//     'function approve(address spender, uint amount) public returns(bool)',
//   ],
//   account
// );

// const init = async () => {
//   const tx = await wbnb.approve(
//     router.address, 
//     'replace by amount covering several trades'
//   );
//   const receipt = await tx.wait(); 
//   console.log('Transaction receipt');
//   console.log(receipt);
// }

factory.on('PairCreated', async (token0, token1, pairAddress) => {
  console.log(`
    New pair detected
    =================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
  `);

  //The quote currency needs to be WBNB (we will pay with WBNB)
  let tokenIn, tokenOut;
  if(token0 === addresses.WBNB) {
    tokenIn = token0; 
    tokenOut = token1;
  }

  if(token1 == addresses.WBNB) {
    tokenIn = token1; 
    tokenOut = token0;
  }

  //The quote currency is not WBNB
  if(typeof tokenIn === 'undefined') {
    return;
  }

  //We buy for 0.1 BNB of the new token
  //ethers was originally created for Ethereum, both also work for BSC
  //'ether' === 'bnb' on BSC
  const amountIn = ethers.utils.parseUnits('0.001', 'ether');
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  //Our execution price will be a bit different, we need some flexbility
  const amountOutMin = amounts[1].sub(amounts[1].div(10));

  console.log(`
    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);

  if (tokenIn == '0x423De25Ee85b3D882865166016c892A44C838395' || tokenOut =='0x423De25Ee85b3D882865166016c892A44C838395' )
  {const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [tokenIn, tokenOut],
    addresses.recipient,
    Date.now() + 1000 * 60 * 10 //10 minutes
    , {
        gasLimit: 1000000
      }
  );

  const receipt = await tx.wait(); 
  console.log('Transaction receipt');
  console.log(receipt);}
});
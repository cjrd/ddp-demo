var util = require("util")
var ddp = require("dotdashpay")

console.log("Initializing DotDashPay platform...")
ddp.platform.initialize({
  // `environment` allows you to specify aspects of the payment pipeline you
  // may want to mock out. "PROCESSOR_SIMULATOR" implies that calls to the
  // payment processor will be mocked, but the rest of the interactions with
  // the DotDashPay platform on your system work as they normally would. To
  // mock out payment peripherals (eg. to simulate a card swipe) you can use
  // the "PERIPHERAL_SIMULATOR" environment. If you want to mock out the
  // DotDashPay platform completely, you can use the "MIDDLEWARE_SIMULATOR"
  // environment
  environment: "PROCESSOR_SIMULATOR",
}).onInitialized(data => {
  console.log("initialized")
  performLoyaltyTransaction()
}).onInitializeError(printError("Initialization error"))

function performLoyaltyTransaction() {
  ddp.platform.listenForInteraction({
    transactionMode: "IDENTIFY"
  })
    .onStartedListeningForInteraction(res => {
      console.log("Tap your phone to the payment hardware")
    })
    .onStartedInteraction(printResult("onStartedInteraction"))
    .onGotInteraction(res => {
      // Print a customer greeting if the customer has a loyalty profile
      // If the customer does not have a loyalty profile, then a loyalty
      // enrollment request will be sent to the customer's phone via the
      // native Apple or Android loyalty enrollment functionality.
      if (res.customerProfile && res.customerProfile.fullName) {
        console.log(`Hello, ${res.customerProfile.fullName}`)
      } else {
        console.log("Customer does not have a loyalty profile -- a loyalty enrollment request will be sent to their phone")
      }

      // BONUS
      // Here we fetch the full transaction chain, which includes details of
      // every step of the transaction.
      // This step is not necessary, but demonstrates how you can
      // obtain all of the transaction data at a later time.
      ddp.payment.getTransaction({transactionChainId: res.transactionChainId})
        .onGotTransaction(res => {
          printResult("onGetTransaction")(res)
          if (res.interaction.response.customerProfile &&
              res.interaction.response.customerProfile.id) {
            console.log(`Thanks for shopping with us ${res.interaction.response.customerProfile.fullName}!`)
          }
          ddp.close()
        }).onGetTransactionError(printError("onGetTransactionError"))
    })
    .onListenForInteractionError(printError("onListenForInteractionError"))
}

function printResult(step) {
  return result => {
    console.log(step, "result: ", util.inspect(result, {depth: 8}, 4))
  }
}

function printError(step) {
  return error => {
    console.error(step, "error: ", util.inspect(error, {depth: 8}, 4))
    process.exit(1)
  }
}

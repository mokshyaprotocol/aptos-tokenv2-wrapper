The SDK which can be utilized for integrating smart contract is available in the folder 
**package/sdk/wrapper.ts**

# Cloning the repository

``` git clone https://github.com/mokshyaprotocol/aptos-token-vesting ```

Change the file path in dependencies and update the addresses 

# Compile

``` aptos move compile --named-addresses --named-addresses wrapper=<YOUR ADDRESS> ```

# Test

``` aptos move test ```

# Publish

```aptos move publish --named-addresses  wrapper=<YOUR ADDRESS> ```

# Update program address

Update program address inside tests **tests/test.ts** 

# Run test

```yarn test```
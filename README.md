# updateddns.js

This is a simple node.js script to update Cloudflare DNS records with your current Internet-facing IP address. The main use case for this script is to keep DNS records current with an IP address that tends to change on occasion. 

It seems there are ways to do this in several other languages (which require compiling, etc), but so far no easy ways to do it in javascript. Well, now there is.

You're welcome.

## Prerequisites
- Node.js installed on your machine
- Cloudflare account with API token

## Installation
1. Clone the repository:
    ```
    git clone <repository-url>
    cd <repository-directory>
    ```
2. Install the required dependencies:
    ```
    npm install
    ```

## Usage
1. Modify the script to add your cloudflare api key and domain name(s) to update
2. Run the script:
    ```
    node updateddns.js
    ```

You may want to set this up to run on a chron job - say, every 15 minutes or so.
The latest IP address is cached, so Cloudflare APIs aren't contacted unless it changes (or no cached address is found).

## License
This project is licensed under the MIT License. See the LICENSE file for details.

Contributing
Contributions are welcome! Please open an issue or submit a pull request.

Contact
For any questions or issues, please open an issue in the repository.
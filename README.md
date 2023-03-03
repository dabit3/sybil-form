## Sybil Resistant Forms with Gitcoin Passport, EXM, and Next.js

This is full stack forkable project for building Sybil-resistant forms, using the
[Gitcoin Passport](https://passport.gitcoin.co/) to score users for your app and implement a secure, sybil-resistant, form and [EXM](https://exm.dev/) (a protocol built on [Arweave](https://www.arweave.org/)) for storing the form data.

Gitcoin Passport is a tool that enables developers to build Sybil resistant
applications while preserving privacy. The [Scorer
API](https://scorer.gitcoin.co/) used in this example gives developers an easy
way of retrieving a wallet's Passport score.

### Project Overview

This app consists of two pages:

1. The landing page (`/`) will allow users to access the form if they have met the threshold score you require in your app, and they will then be able to submit their form entry. In the server routes (`pages/api/post`, `pages/api/set-nonce`) they will be verified again using a wallet signature and a nonce to verify their identity before being able to post.

2. The Admin route (`/admin`) will allow a whitelisted array of admins to be able to access the form data securely. If they are an admin, they will be able to view the results, if they are not, they will not be allowed to view the results.

### Getting started

1. Gitcon Passport API variables

    To get started, you must first create an environment variable and community using the [Gitcoin Scorer API](https://scorer.gitcoin.co/).

    You can look through this codebase to see what a simple integration with Gitcoin Passport looks like. For more detailed information [check out the documentation](https://docs.passport.gitcoin.co/).

2. EXM API Key

    You also need to create an [EXM API Key](https://exm.dev/app) and have it ready for the next steps.

### Running the app

1. Clone the repo and install the dependencies:

    ```sh
    git clone git@github.com:dabit3/nextjs-gitcoin-passport.git

    cd nextjs-gitcoin-passport

    npm install
    ```

2. Configure the environment variables for your:

    a. Gitcoin Community ID    
    b. Gitcoin API Key    
    c. EXM API Key    
    d. Minimum score for your form

   In a file named `.env.local`. (see example configuration at
   `.example.env.local`)

    ```
    NEXT_PUBLIC_GC_API_KEY=<your-api-key>
    NEXT_PUBLIC_GC_COMMUNITY_ID=<your-community-id>
    EXM_API_KEY=<your-exm-api-key>
    NEXT_PUBLIC_THRESHOLD=<your-minimum-score>
    ```

3. Deploy the EXM function

    ```sh
    export EXM_API_KEY=<your-exm-api-key>

    node deploy.js
    ```

4. Run the app

    ```sh
    npm run dev
    ```

### Next Steps

Once you've gotten a handle on how the integration works, check out some of the
following links for more information on how to integrate Gitcoin Passport into
your own application.

- [Official Documentation](https://docs.passport.gitcoin.co/)
- [Official Website](https://go.gitcoin.co/passport?utm_source=awesome-passports&utm_medium=referral&utm_content=Passport)
- [Twitter Account](https://twitter.com/gitcoinpassport)

### Getting Involved

If you're interested in getting involved, join Gitcoin's
[Discord](https://gitcoin.co/discord) and look for the [🛠passport-builders
channel](https://discord.com/channels/562828676480237578/986222591096279040).


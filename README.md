## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Generate jwt keys

```bash
openssl ecparam -genkey -name prime256v1 -noout -out jwt.key
openssl ec -in jwt.key -pubout -out jwt.key.pub
```

## Generate Module

```bash
nest g res modules/[Module Name]
```

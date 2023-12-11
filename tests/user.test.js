var mongoose = require('mongoose');
const request = require("supertest");
const { dbConnect, dbDisconnect } = require("./test-utils/dbHandler");
const { validateNotEmpty } = require("./test-utils/validators")
const { User } = require("../model/user")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = require("../app");
const server = require('../app');

require("dotenv").config();

beforeAll(async () => await dbConnect());

afterAll(async () => {
    await dbDisconnect()
    server.unref()
    await server.close()
});

const fakeUserData = {
    username: 'dummyUser',
    password: '********',
    OwnedFolder: new mongoose.Types.ObjectId()
  };

var get_cookies = function(request) {
    var cookies = {};

    var parts =  request.headers['set-cookie'].toString().split(';').toString().match(/(.*?)=(.*)$/)
    cookies[ parts[1].trim() ] = (parts[2] || '').trim();

    return cookies;
};

describe("GET /logout", () => {
    it("should log user out of the account", async () => {
      const res = await request(app).get("/logout");
      expect(res.body.success).toBe(true);
    });
});

describe('User Model Test Suite', () => {
    test('should validate saving a new user successfully', async () => {
      const hashedPassword = await bcrypt.hash(fakeUserData.password, 10);
      const validUser = new User({
        password: hashedPassword,
        username: fakeUserData.username,
        OwnedFolder: fakeUserData.OwnedFolder
      });
      const savedUser = await validUser.save();
  
      validateNotEmpty(savedUser);
  
      expect(savedUser.username).toEqual(fakeUserData.username);
      expect(bcrypt.compare(fakeUserData.password, savedUser.password)).toBeTruthy();
      expect(savedUser.OwnedFolder).toBe(fakeUserData.OwnedFolder)

    });
});

describe("POST /signup", () => {
    it("should signup user into an account", async () => {
      // Test Case 1: Missing username and password
      let res = await request(app).post("/signup");
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
          "message": "All Field Inputs Are Required",
          "success": false
      });
        
      // Test Case 2: Successful signup
      res = await request(app).post("/signup").send({
        "username": "test",
        "password": "test"
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            success: true,
            message: "Account created successfully 😊 👌"
        });

        expect(res.headers['set-cookie']).toBeTruthy()
        const cookie = get_cookies(res)['access_token'].split(',')[0]
        expect(cookie).toContain('ey')
        const token = jwt.verify(cookie, process.env.TOKEN_KEY);
        expect(token).toBeTruthy()
        expect(token.userId).toBeTruthy()

      // Test Case 3: Duplicate username (conflict)
      res = await request(app).post("/signup").send({
        "username": "test",
        "password": "test"
    });
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
        success: false,
        message: "User Already Exist. Please Login"
    });

      // Test Case 4: Empty password
      res = await request(app).post("/signup").send({
        "username": "test1",
        "password": ""
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
        success: false,
        message: "All Field Inputs Are Required"
    });

      // Test Case 5: Empty username
      res = await request(app).post("/signup").send({
        "username": "",
        "password": "test1"
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
        success: false,
        message: "All Field Inputs Are Required"
    });

      // Test Case 6: Short username and password
      res = await request(app).post("/signup").send({
        "username": "1",
        "password": "1"
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
        success: false,
        message: "Username and Password Length should be more or equal to 4"
    });
      
    });
});

describe("POST /login", () => {
        it("should return a 400 status code and error message for missing fields", async () => {
            let res = await request(app).post("/login");
            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({"message": "All Field Inputs Are Required", "success": false});
        })
        it("should return a 400 status code and error message for invalid credentials", async () => {
            res = await request(app).post("/login").send({"username": "test", "password": "testtest"});
            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({"message": "Invalid Credentials", "success": false});
        })
    });
      it("should login user into an account and verify token", async () => {

        res = await request(app).post("/login").send({"username": fakeUserData.username, "password": fakeUserData.password});

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ success: true, message: "Logged in successfully 😊 👌" });
        expect(res.headers['set-cookie']).toBeTruthy()
        const cookie = get_cookies(res)['access_token'].split(',')[0]
        expect(cookie).toContain('ey')
        const token = jwt.verify(cookie, process.env.TOKEN_KEY);
        expect(token).toBeTruthy()
        expect(token.userId).toBeTruthy()
      

});

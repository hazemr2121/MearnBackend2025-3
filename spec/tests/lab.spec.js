const request = require("supertest");
const app = require("../..");
const { clearDatabase } = require("../../db.connection");

const req = request(app);

describe("lab testing:", () => {
  describe("users routes:", () => {
    let fakeUser, userToken;

    beforeAll(async () => {
      fakeUser = { name: "ali", email: "ali@gmail.com", password: "asd123" };
      await req.post("/user/signup").send(fakeUser);
      let res = await req.post("/user/login").send(fakeUser);
      userToken = res.body.data;
    });

    afterAll(async () => {
      await clearDatabase();
    });

    it("req to get(/user/search) ,expect to get the correct user with his name", async () => {
      let res = await req
        .get("/user/search")
        .query({ name: "ali" })
        .set({ authorization: userToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe("ali");
    });

    it("req to get(/user/search) with invalid name ,expect res status and res message to be as expected", async () => {
      let res = await req
        .get("/user/search")
        .query({ name: "invalid" })
        .set({ authorization: userToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("There is no user with name: invalid");
    });
  });

  describe("todos routes:", () => {
    let fakeUser, userToken, toDO;

    beforeAll(async () => {
      fakeUser = { name: "ali", email: "ali@gmail.com", password: "asd123" };
      let signupRes = await req.post("/user/signup").send(fakeUser);
      fakeUser._id = signupRes.body.data._id;
      let loginRes = await req.post("/user/login").send(fakeUser);
      userToken = loginRes.body.data;

      res = await req
        .post("/todo")
        .send({ title: "do your assignments" })
        .set({ authorization: userToken });
      toDO = res.body.data;
    });

    afterAll(async () => {
      await clearDatabase();
    });

    it("req to patch(/todo/) with id only ,expect res status and res message to be as expected", async () => {
      let res = await req
        .patch("/todo/")
        .send({ _id: toDO._id })
        .set({ authorization: userToken });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain("Not found");
    });

    it("req to patch(/todo/:id) with id and title ,expect res status and res to be as expected", async () => {
      let res = await req
        .patch(`/todo/${toDO._id}`)
        .send({ title: "updated title" })
        .set({ authorization: userToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe("updated title");
    });

    it("req to get(/todo/user) ,expect to get all user's todos", async () => {
      let res = await req.get("/todo/user").set({ authorization: userToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("updated title");
    });

    it("req to get(/todo/user) ,expect to not get any todos for user hasn't any todo", async () => {
      await req.delete("/todo/").set({ authorization: userToken });

      let res = await req.get("/todo/user").set({ authorization: userToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain(
        `Couldn't find any todos for ${fakeUser._id}`
      );
    });
  });
});

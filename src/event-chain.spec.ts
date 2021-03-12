import { PragmaticEventChain } from "./event-chain";

describe("EventChain", () => {
  it("should add subscriber", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    const result = sut.subscribe(topic, async () => {
      console.log("hello test");
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("should add subscriber on specified index", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    const expectedIndex = 988756;

    const result = sut.subscribe(
      topic,
      async () => {
        console.log("hello test");
      },
      expectedIndex
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.id).toEqual(expectedIndex);
  });

  it("should remove subscriber", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    let wasCalled = false;
    const result = sut.subscribe(topic, async () => {
      wasCalled = true;
    });
    sut.unsubscribe(result);

    await sut.publish(topic);

    expect(wasCalled).toBeFalsy();
  });

  it("should only remove specified subscriber", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    let unsubedWasCalled = false;
    const tokenToBeRemoved = sut.subscribe(topic, async () => {
      unsubedWasCalled = true;
    });

    let wasCalled = false;
    sut.subscribe(topic, async () => {
      wasCalled = true;
    });

    sut.unsubscribe(tokenToBeRemoved);
    await sut.publish(topic);

    expect(unsubedWasCalled).toBeFalsy();
    expect(wasCalled).toBeTruthy();
  });

  it("should call subscriber callback", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    let wasCalled = false;
    sut.subscribe(topic, async () => {
      wasCalled = true;
    });

    await sut.publish(topic);

    expect(wasCalled).toBeTruthy();
  });

  it("should call every subscriber callback", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    let firstCbWasCalled = false;
    sut.subscribe(topic, async () => {
      firstCbWasCalled = true;
    });
    let secondCbWasCalled = false;
    sut.subscribe(topic, async () => {
      secondCbWasCalled = true;
    });
    let thirdCbWasCalled = false;
    sut.subscribe(topic, async () => {
      thirdCbWasCalled = true;
    });

    await sut.publish(topic);

    expect(firstCbWasCalled).toBeTruthy();
    expect(secondCbWasCalled).toBeTruthy();
    expect(thirdCbWasCalled).toBeTruthy();
  });

  it("should sort subscriber depending on chainIndex", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";
    const firstSubscribedId = "firstSub";
    const lastSubscribedId = "lastSub";

    const calls: string[] = [];
    sut.subscribe(
      topic,
      async () => {
        calls.push(firstSubscribedId);
      },
      200
    );

    sut.subscribe(
      topic,
      async () => {
        calls.push(lastSubscribedId);
      },
      100
    );

    await sut.publish(topic);

    const secondResult = calls.pop();
    const firstResult = calls.pop();

    expect(firstResult).toBeDefined();
    expect(secondResult).toBeDefined();

    expect(firstResult).toEqual(lastSubscribedId);
    expect(secondResult).toEqual(firstSubscribedId);
  });

  it("should publish args to subscriber", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    type TestObj = {
      id: string;
      val: {
        name: string;
        sirname: string;
      };
    };

    let wasCalled = false;
    let resultingArgs;
    sut.subscribe(topic, async (obj: TestObj) => {
      wasCalled = true;
      resultingArgs = obj;
    });

    const testData: TestObj = {
      id: "testId",
      val: {
        name: "theTest",
        sirname: "ofTestingHouse",
      },
    };
    await sut.publish(topic, testData);

    expect(wasCalled).toBeTruthy();
    expect(resultingArgs).toBeDefined();
    expect(resultingArgs).toEqual(testData);
  });

  it("should pass intermediate results to successor ChainLink", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    type TestObj = {
      id: string;
      val: {
        name: string;
        sirname: string;
      };
    };

    const testData: TestObj = {
      id: "testId",
      val: {
        name: "theTest",
        sirname: "ofTestingHouse",
      },
    };

    const expectedResult: TestObj = {
      id: "testId",
      val: {
        name: "theTest" + 1 + "hi",
        sirname: "ofTestingHouse",
      },
    };

    sut.subscribe(topic, async (obj: TestObj) => {
      obj.val.name = obj.val.name + 1;
      return obj;
    });

    sut.subscribe(topic, async (obj: TestObj) => {
      obj.val.name = obj.val.name + "hi";
      return obj;
    });

    const data = await sut.publish(topic, testData);
    const result = data as TestObj;

    expect(result).toBeDefined();
    expect(result).toEqual(expectedResult);
  });

  it("shouldn't remove any ChainLink's by none existent chainIndex", async () => {
    const sut = new PragmaticEventChain();
    const topic = "testTopic";

    let wasCalled = false;
    const result = sut.subscribe(topic, async () => {
      wasCalled = true;
    });

    sut.unsubscribe({ id: 76345678 });

    await sut.publish(topic);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(wasCalled).toBeTruthy();
  });
});

// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import fs from "fs";
import path from "path";
import Selianize, { ParseError, RegisterConfigurationHook, RegisterSuiteHook, RegisterTestHook, RegisterEmitter, RegisterLocationEmitter } from "../src";

describe("Selenium code serializer", () => {
  it("should export the code to javascript", () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-1.side")));
    return expect(Selianize(project)).resolves.toBeDefined();
  });
  it("hook should add configuration code", async () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-3-single-test.side")));
    const hook = jest.fn();
    hook.mockReturnValue(Promise.resolve("some code the the top"));
    RegisterConfigurationHook(hook);
    return expect((await Selianize(project))[0].code).toMatch(/some code the the top/);
  });
  it("should register a suite emitter hook", async () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-3-single-test.side")));
    const hook = jest.fn();
    hook.mockReturnValue(Promise.resolve({before: "", after: "", beforeAll: "", afterAll: ""}));
    RegisterSuiteHook(hook);
    await Selianize(project);
    expect(hook).toHaveBeenCalledTimes(1);
  });
  it("should add a before and after code", async () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-3-single-test.side")));
    const hook = jest.fn();
    hook.mockReturnValue(Promise.resolve({before: "before code", beforeAll: "before all code", after: "after code", afterAll: "after all code"}));
    RegisterSuiteHook(hook);
    return expect((await Selianize(project))[0].code).toMatch(/describe\("aaa suite", \(\) => {beforeAll\(async \(\) => {before all code}\);beforeEach\(async \(\) => {before code}\);afterEach\(async \(\) => {after code}\);afterAll\(async \(\) => {after all code}\);it\(/);
  });
  it("should register a test emitter hook", async () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-1.side")));
    const hook = jest.fn();
    hook.mockReturnValue(Promise.resolve({setup: "", teardown: ""}));
    RegisterTestHook(hook);
    await Selianize(project);
    expect(hook).toHaveBeenCalledTimes(3);
  });
  it("hook should add setup and teardown code", async () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-3-single-test.side")));
    const hook = jest.fn();
    hook.mockReturnValue(Promise.resolve({setup: "", teardown: ""}));
    hook.mockReturnValueOnce(Promise.resolve({setup: "some setup code", teardown: "other teardown code"}));
    RegisterTestHook(hook);
    return expect((await Selianize(project))[0].code).toMatch(/it\("aa playback", async \(\) => {some setup code.*other teardown codeawait.*}\);/);
  });
  it("should register a new command emitter", async () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-4-new-command.side")));
    const hook = jest.fn();
    hook.mockReturnValue(Promise.resolve("some new command code"));
    RegisterEmitter("newCommand", hook);
    return expect((await Selianize(project))[0].code).toMatch(/some new command codeawait/);
  });
  it("should register a new location emitter", async () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-5-new-locator.side")));
    const hook = jest.fn();
    hook.mockReturnValue(Promise.resolve("some new location code"));
    RegisterLocationEmitter("newLocator", hook);
    return expect((await Selianize(project))[0].code).toMatch(/elementLocated\(some new location code\)/);
  });
  it("should fail to export a project with errors", () => {
    const project = JSON.parse(fs.readFileSync(path.join(__dirname, "test-files", "project-2.side")));
    const failure = {
      name: "Untitled Project",
      suites: [
        {
          id: "891b6389-7623-45b0-a986-89089de07cdb",
          name: "aaab suite",
          tests: [
            {
              commands: [
                {
                  command: "waitForPageToLoad",
                  id: "fc7a1e3d-4a0e-45b5-9ee4-56bce9f1dd2c",
                  index: 1,
                  message: "Unknown command waitForPageToLoad",
                  target: "",
                  value: ""
                }
              ],
              id: "33399e09-f96c-4b7c-801c-f8ff9567b8a5",
              name: "aaba failure"
            },
            {
              commands: [
                {
                  command: "waitForElementPresent",
                  id: "0a0b6a3e-c1e9-4ef7-9748-dee1586be715",
                  index: 1,
                  message: "Unknown command waitForElementPresent",
                  target: "",
                  value: ""
                }
              ],
              id: "44955d17-a69d-4d1a-967d-05fd70b51905",
              name: "aabb failure"
            }
          ]
        }
      ]
    };
    return expect(Selianize(project)).rejects.toMatchObject(failure);
  });
  it("should parse the error to markdown", () => {
    const failure = {
      name: "Untitled Project",
      suites: [
        {
          id: "891b6389-7623-45b0-a986-89089de07cdb",
          name: "aaab suite",
          tests: [
            {
              commands: [
                {
                  command: "waitForPageToLoad",
                  id: "fc7a1e3d-4a0e-45b5-9ee4-56bce9f1dd2c",
                  index: 1,
                  message: "Unknown command waitForPageToLoad",
                  target: "",
                  value: ""
                }
              ],
              id: "33399e09-f96c-4b7c-801c-f8ff9567b8a5",
              name: "aaba failure"
            },
            {
              commands: [
                {
                  command: "waitForElementPresent",
                  id: "0a0b6a3e-c1e9-4ef7-9748-dee1586be715",
                  index: 1,
                  message: "Unknown command waitForElementPresent",
                  target: "",
                  value: ""
                }
              ],
              id: "44955d17-a69d-4d1a-967d-05fd70b51905",
              name: "aabb failure"
            }
          ]
        }
      ]
    };
    expect(ParseError(failure)).toBe(`## aaab suite\n### aaba failure\n${failure.suites[0].tests[0].commands[0].index}. ${failure.suites[0].tests[0].commands[0].message}\n\n### aabb failure\n${failure.suites[0].tests[1].commands[0].index}. ${failure.suites[0].tests[1].commands[0].message}\n\n`);
  });
});

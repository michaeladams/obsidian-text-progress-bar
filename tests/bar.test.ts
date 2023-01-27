
import * as manifest from '../manifest.json';

import { ProgressBar } from "../src/bar"


describe("Calculates progress", () => {
  it("when we want to show percentage complete", () => {

    const pb = new ProgressBar('Books read', 0, 10)
    expect(pb.getDonePercent()).toStrictEqual(0)

    pb.done = 5
    expect(pb.getDonePercent()).toStrictEqual(50)

    pb.done = 10
    expect(pb.getDonePercent()).toStrictEqual(100)

    pb.done = 20
    expect(pb.getDonePercent()).toStrictEqual(200)

  })

  it("when it calculates how many filled parts to show", () => {

    const pb = new ProgressBar('Books read', 0, 15)
    expect(pb.getDoneParts()).toStrictEqual(0)

    pb.done = 5
    expect(pb.getDoneParts()).toStrictEqual(5)

    pb.done = 10
    expect(pb.getDoneParts()).toStrictEqual(10)

    pb.done = 20
    expect(pb.getDoneParts()).toStrictEqual(15)

  })

  it("when partial progress is made, remainder is returned", () => {

    const pb = new ProgressBar('Books read', 1, 10)
    pb.length = 1
    expect(pb.getRemainder()).toStrictEqual(0.1)

  })

  it("when progress is made, but divisible into length, no remainder is returned", () => {

    const pb = new ProgressBar('Books read', 5, 10)
    pb.length = 2
    expect(pb.getDoneParts()).toStrictEqual(1)
    expect(pb.getRemainder()).toStrictEqual(0)

  })

})

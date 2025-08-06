import { Behavior } from "@dreamlab/engine";

export default class HelloWorld extends Behavior {

    onInitialize() {
        console.log('hello world!');
    }
}


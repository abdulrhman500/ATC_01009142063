

import { Container } from "inversify"; // Import Container

const TYPES = {
    // Controller: Symbol.for("Controller"),
};

const container = new Container();

export {
    container,
    TYPES
}
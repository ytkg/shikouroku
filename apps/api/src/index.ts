import { createApp } from "./app/create-app";
import { withScheduledHandler } from "./app/scheduled";

export default withScheduledHandler(createApp());

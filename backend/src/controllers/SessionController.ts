import { Body, Controller, Post, Route, Tags } from "tsoa";
import { generateSession } from "../lib/engine";
import type { SessionInput, GeneratedSession } from "../models/Session";

@Route("api/sessions")
@Tags("Sessions")
export class SessionController extends Controller {
  /**
   * Generate a personalised climbing session based on the provided inputs.
   * No authentication required.
   */
  @Post("generate")
  public async generate(@Body() body: SessionInput): Promise<GeneratedSession> {
    return generateSession(body);
  }
}

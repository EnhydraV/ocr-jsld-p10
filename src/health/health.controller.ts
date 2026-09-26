import { Controller, Get } from '@nestjs/common';
import { loadConfig } from '../config';

// Sonde de vie : repond des que le processus sert du HTTP.
@Controller('health')
export class HealthController {
  @Get()
  health(): { status: 'ok'; instance: string } {
    return { status: 'ok', instance: loadConfig().instanceName };
  }
}

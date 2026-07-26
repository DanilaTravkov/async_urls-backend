import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUrl } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({
    example: ['https://example.com', 'https://nestjs.com'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    { each: true },
  )
  urls!: string[];
}

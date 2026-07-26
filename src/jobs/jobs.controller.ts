import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateJobDto } from './dto/create-job.dto';
import {
  JobDetailsResponseDto,
  JobIdResponseDto,
  JobsPageResponseDto,
} from './dto/job-response.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a URL checking job' })
  @ApiAcceptedResponse({ type: JobIdResponseDto })
  @ApiBadRequestResponse({ description: 'Request body validation failed' })
  create(@Body() body: CreateJobDto): Promise<JobIdResponseDto> {
    return this.jobsService.create(body.urls);
  }

  @Get()
  @ApiOperation({ summary: 'List jobs from newest to oldest' })
  @ApiOkResponse({ type: JobsPageResponseDto })
  @ApiBadRequestResponse({ description: 'Pagination parameters are invalid' })
  findPage(@Query() query: ListJobsQueryDto): Promise<JobsPageResponseDto> {
    return this.jobsService.findPage(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job details' })
  @ApiOkResponse({ type: JobDetailsResponseDto })
  @ApiBadRequestResponse({ description: 'Job ID is not a UUID' })
  @ApiNotFoundResponse({ description: 'Job does not exist' })
  findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<JobDetailsResponseDto> {
    return this.jobsService.findById(id);
  }
}

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { UrlShortenerStack } from '../lib/url-shortener-stack';

const app = new cdk.App();
new UrlShortenerStack(app, 'UrlShortenerStack');

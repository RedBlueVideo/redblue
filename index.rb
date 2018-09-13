#! /usr/bin/env ruby

# https://www.phusionpassenger.com/library/deploy/apache/deploy/ruby/
# require 'rack'
require 'nokogiri'
require 'open-uri'

doc = Nokogiri::HTML( open( '' ) )

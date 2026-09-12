# Tracing agents

## obesrvability
Complete vivibilit into every layer of an LLM based software system: the application, the prompt, and the response

Composed by traces and spans in hirarchical way. 
Traces and spans comes from a standard called openTelemetry

### Traces
records the paths taken by requests - make b an application or end-user) as theey propagate through multiple steps. From input to outpu one run of the application

### Spans
data captured onindividual steps in a LLM app or pipilne. Tools chains spans.


## OpenTelemetry (OTEL)
Most widley used stadard for application observability.
OTEL includes:

- ideas of traces and spans included in the application.
- instrumentation - standards on how to capture traces and spans
- collectors and processors - process on how to capture and store traces and spans and enumarete them in a platform.

### Tools used in this course for observability
- Arise Pheonix server - collector used to recive, visualise, evaluatetraces


### Instrumentation
Proces of capturing traces and spans. Marking which functions or code block spans should be collected, and which attributes.

## Why observability is important
- simplifies debuigging
- provides a detailed log - needed to run performance evaluations
- helps understand and control unpredistable behaviour of LLMs
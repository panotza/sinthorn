build:
	docker build -t panotza/sinthorn .
push:
	docker push panotza/sinthorn:latest
run:
	docker run --rm --name sinthorn sinthorn
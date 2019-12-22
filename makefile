build:
	docker build -t sinthorn .
push:
	docker push panotza/sinthorn:latest
run:
	docker run --rm --name sinthorn sinthorn
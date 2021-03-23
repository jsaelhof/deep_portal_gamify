PROJECT = web/dashboard
VERSION = 

all:
	@echo -------------------RELEASE---------------------------------
	@echo make release-version VERSION=[release version]
	@echo make release-next
	@echo -----------------------------------------------------------

guard-%:
	@ if [ "${${*}}" = "" ]; then \
    echo "Variable $* not set"; \
    exit 1; \
  fi

release-version: guard-VERSION
	git checkout master
	git pull --rebase
	git checkout development
	git pull --rebase
	git checkout -b release/$(PROJECT)/$(VERSION) development
	mvn -B release:clean
	mvn -B release:prepare -DreleaseVersion=$(VERSION)
	mvn -B release:perform
	git checkout development
	git merge --no-ff release/$(PROJECT)/$(VERSION) --no-edit
	git checkout master
	git merge --no-ff release/$(PROJECT)/$(VERSION)~1 --no-edit
	git branch -D release/$(PROJECT)/$(VERSION)
	git push origin :release/$(PROJECT)/$(VERSION)
	git push --all
	git push --tags

release-next:
	git checkout master
	git pull --rebase
	git checkout development
	git pull --rebase
	git checkout -b release/$(PROJECT) development
	mvn -B release:clean release:prepare release:perform
	git checkout development
	git merge --no-ff release/$(PROJECT) --no-edit
	git checkout master
	git merge --no-ff release/$(PROJECT)~1 --no-edit
	git branch -D release/$(PROJECT)
	git push origin :release/$(PROJECT)
	git push --all
	git push --tags

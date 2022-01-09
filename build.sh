./node_modules/meta/bin/meta git update \
  && ./node_modules/meta/bin/meta git pull \
  && bundle exec jekyll build \
  && mv _site/homepage/* _site/ \
  && rm -rf _site/homepage/
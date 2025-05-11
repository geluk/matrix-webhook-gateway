SubscriptionAgent queries database for feeds
	Runs update through caching layer

FeedService
	getItems(Feed, cache?): Promise<Item[]>
    cache decisions
    cursor decisions

cursor kind: guid, url, other? -> read spec
what if neither guid nor url are available?
	error?

what are _new_ items?
    order in feed?
    timestamp?
    check spec

what to do with content?
    title only?
    does this need to be configurable per feed?


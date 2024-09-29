package main

type ParseJob struct {
	status string
	payload ResponseFormat
}

var (
	db = make(map[string]ParseJob)
)

func addJob(jobId string, job ParseJob) {
	db[jobId] = job
}

func getJob(jobId string) (ParseJob, bool) {
	job, ok := db[jobId]
	return job, ok
}

func deleteJob(jobId string) {
	delete(db, jobId)
}

func updateJob(jobId string, job ParseJob) {
	db[jobId] = job
}
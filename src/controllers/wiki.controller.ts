import { Request, Response } from 'express';
import { Inject, Service } from 'typedi';
import { Controller, Post } from '../core';
import { WikiService } from '../services/wiki.service';
import { WikiValidationDto } from '../validations/wiki.validation';

@Service()
@Controller('/wiki')
export default class WikiController {

    @Inject(() => WikiService)
    private readonly wikiService: WikiService;

    @Post('/stream', WikiValidationDto, {
        isAuthenticated: false,
        authorizedRole: 'all',
    }, {})
    async postWikiData(req: Request, res: Response): Promise<void> {
        try {
            const { repo_url, token, prompt } = req.body;
            if (!repo_url || !prompt) {
                res.status(400).json({ message: 'repo_url,  and prompt are required' });
                return;
            }
            const data = await this.wikiService.fetchGitHubWikiData(repo_url, token, prompt);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error in WikiController:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

}

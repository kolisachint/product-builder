import { Router, Request, Response } from 'express';
import { ProfileService, ServiceError } from '../services/profile.service';
import { ApiResponse } from '../../shared/shared_types';

const router = Router();
const profileService = new ProfileService();

/**
 * POST /profiles/:id/kyc - Submit KYC documents
 */
router.post('/:id/kyc', async (req: Request, res: Response) => {
  try {
    const profile = profileService.submitKyc(req.params.id, req.body);
    const response: ApiResponse<typeof profile> = { data: profile };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof ServiceError) {
      const response: ApiResponse<never> = {
        data: null as any,
        error: { error: error.message, code: error.code },
      };
      res.status(error.code).json(response);
    } else {
      const response: ApiResponse<never> = {
        data: null as any,
        error: { error: 'Internal server error', code: 500 },
      };
      res.status(500).json(response);
    }
  }
});

/**
 * PATCH /profiles/:id/kyc - Review KYC submission (admin action)
 */
router.patch('/:id/kyc', async (req: Request, res: Response) => {
  try {
    const profile = profileService.reviewKyc(req.params.id, req.body);
    const response: ApiResponse<typeof profile> = { data: profile };
    res.status(200).json(response);
  } catch (error) {
    if (error instanceof ServiceError) {
      const response: ApiResponse<never> = {
        data: null as any,
        error: { error: error.message, code: error.code },
      };
      res.status(error.code).json(response);
    } else {
      const response: ApiResponse<never> = {
        data: null as any,
        error: { error: 'Internal server error', code: 500 },
      };
      res.status(500).json(response);
    }
  }
});

export default router;
